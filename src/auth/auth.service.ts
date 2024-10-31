/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// services
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { CryptoService } from '../crypto/crypto.service';
import { FilesService } from '../files/files.service';
import { SystemService } from '../system/system.service';
// interfaces
import { UserPayload } from './interfaces/userPayload.interface';
import { ApiKeysResponseI, SessionsResponseI } from './interfaces/apikey.interface';
import { MessageResponseI, AuthResponseI } from './interfaces/response.interface';
import { UserL } from '../users/interfaces/userl.interface';
import { UserTries, Lasttry } from './interfaces/tries.interface';
// misc
import * as dayjs from 'dayjs';

/**
 * @class Servicio de Autenticacion
 */
@Injectable()
export class AuthService {
  private timeout = 30;
  private maxTries = 10;
  private tries: UserTries = {};
  private lastTries: Lasttry = {};

  constructor(
    private readonly configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private filesService: FilesService,
    private sessionsService: SessionsService,
    private system: SystemService
  ) {
    this.maxTries = Number(this.configService.get<number>('AUTH_MAX_TRIES') || 10);
    this.timeout = Number(this.configService.get<number>('AUTH_TIMEOUT') || 30);
    if (this.maxTries < 1 || isNaN(this.maxTries)) {
      this.maxTries = 10;
    }
    if (this.timeout < 1 || isNaN(this.timeout)) {
      this.timeout = 30;
    }
  }

  private resetTries(userId: string) {
    this.tries[userId] = 0;
  }

  private incrementTries(userId: string) {
    if (!this.tries[userId]) {
      this.tries[userId] = 0;
    }
    if (!this.lastTries[userId]) {
      this.lastTries[userId] = dayjs().toDate();
    }
    this.tries[userId]++;
  }

  private allowLogin(userId: string) {
    const today = new Date();
    const MinutesSinceLastTry = dayjs(today).diff(dayjs(this.lastTries[userId]), 'minute');
    const timeoutPassed = MinutesSinceLastTry < this.timeout;
    if (!timeoutPassed) {
      this.resetTries(userId);
    }
    if (!this.tries[userId]) {
      return true;
    }
    if (!timeoutPassed) {
      return false;
    }
    return this.tries[userId] < this.maxTries;
  }

  /**
   * Crear un usuario con un usuario y contraseña
   * @param {string} userName Nombre del usuario
   * @param {string} pasword contraseña en texto plano
   * @returns {Promise<AuthResponseI>} Token de Auth por JWT
   */
  async login(userName: string, pasword: string, device: string = ''): Promise<AuthResponseI> {
    const user = await this.usersService.findOne({ username: userName });
    if (!user) {
      throw new BadRequestException('Usuario o contraseña incorrectos');
    }
    if (!this.allowLogin(user.id)) {
      throw new BadRequestException('Demasiados intentos fallidos');
    }
    if (!this.cryptoService.comparePasswords(pasword, user.passwordu)) {
      this.incrementTries(user.id);
      throw new BadRequestException('Usuario o contraseña incorrectos');
    }
    const newSessionId = this.sessionsService.createSesionId();
    const payload: UserPayload = { sessionId: newSessionId, userId: user.id, username: user.username, isadmin: user.isadmin };
    await this.sessionsService.createSession(newSessionId, payload, device);
    this.system.emitChangeSessions(user.id);
    return {
      access_token: this.jwtService.sign(payload)
    };
  }

  /**
   * Crear un api key de un usuario con apikey
   * @param {UserPayload} user datos de usuario
   * @returns {Promise<AuthResponseI>} apikey
   * */
  async createApiKey(user: UserPayload, name: string): Promise<AuthResponseI> {
    const sessionId = this.sessionsService.createSesionId();
    const payload: UserPayload = { sessionId, userId: user.userId, username: user.username, isadmin: user.isadmin };
    const access_token = this.jwtService.sign(payload);
    await this.sessionsService.createApiKey(name, sessionId, payload, access_token);
    this.system.emitChangeSessions(user.userId);
    return { access_token };
  }

  /**
   * Crear un nuevo usuario
   * @param {string} userName Nombre del usuario nuevo
   * @param {string} pasword Contraseña en texto plano
   * @returns {Promise<AuthResponseI>} el Access Token del Usuario
   */
  async register(userName: string, pasword: string, device: string = ''): Promise<AuthResponseI> {
    const user = await this.usersService.findOne({ username: userName });
    if (user) {
      throw new BadRequestException('Usuario ya existe');
    }
    const newUser = await this.usersService.create({
      id: this.cryptoService.createUserId(userName),
      username: userName,
      passwordu: this.cryptoService.createPassword(pasword)
    });
    const newSessionId = this.sessionsService.createSesionId();
    const payload: UserPayload = { sessionId: newSessionId, userId: newUser.id, username: newUser.username, isadmin: newUser.isadmin };
    await this.sessionsService.createSession(newSessionId, payload, device);
    this.filesService.createFolder('', payload);
    this.system.emitChangeUsersUpdates();
    return {
      access_token: this.jwtService.sign(payload)
    };
  }

  /**
   * Logout de un usuario
   * @param {string} sessionId Id de Sesion
   * @returns {Promise<MessageResponseI>}
   */
  async logout(sessionId: string): Promise<MessageResponseI> {
    const user = await this.sessionsService.revokeSession(sessionId);
    if (user !== null) {
      this.system.emitChangeSessions(user.userid);
    }
    return { message: 'logout' };
  }

  /**
   * Crear un nuevo usuario con admin
   * @param {string} userName Nombre del usuario nuevo
   * @param {string} pasword Contraseña en texto plano
   * @returns {Promise<AuthResponseI>} el Access Token del Usuario
   */
  async registerAdmin(userName: string, pasword: string): Promise<AuthResponseI & { idUser: string }> {
    const user = await this.usersService.findOne({ username: userName });
    if (user) {
      throw new BadRequestException('Usuario ya existe');
    }
    const idUser = this.cryptoService.createUserId(userName);
    const newUser = await this.usersService.create({
      id: idUser,
      username: userName,
      passwordu: this.cryptoService.createPassword(pasword),
      isadmin: true
    });
    const payload: UserPayload = { sessionId: '', userId: newUser.id, username: newUser.username, isadmin: newUser.isadmin };
    this.filesService.createFolder('', payload);
    this.system.emitChangeUsersUpdates();
    return {
      access_token: this.jwtService.sign(payload),
      idUser
    };
  }
  /**
   * Eliminar un Usuario Por userId
   * @param userid
   * @returns {Promise<MessageResponseI>}
   */
  async deleteUser(userid: string): Promise<MessageResponseI> {
    const user = this.usersService.findOne({ id: userid });
    if (!user) {
      throw new NotFoundException('usuario no encontrado');
    }
    await this.usersService.delete({ id: userid });
    this.system.emitChangeUsersUpdates();
    return { message: 'user deleted' };
  }

  /**
   * Cambiar la contarseña de un usuario con confirmacion de contraseña
   * @param {string} userId Id de Usuario
   * @param {string} password contraseña actual
   * @param {string} newPassword nueva contraseña
   * @returns {Promise<MessageResponseI>}
   */
  async changePassword(userId: string, password: string, newPassword: string): Promise<MessageResponseI> {
    const user = await this.usersService.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException('Usuario no existe');
    }
    if (this.cryptoService.comparePasswords(password, user.passwordu)) {
      await this.usersService.update({ id: userId }, { passwordu: this.cryptoService.createPassword(newPassword) });
      return { message: 'password changed' };
    }
    throw new BadRequestException('Contraseña incorrecta');
  }

  /**
   * Cambiar contraseña de un Usuario
   * Agregar Validacion
   * @param userId Id de Usuario
   * @param newPassword Nueva Contraseña
   * @returns {Promise<MessageResponseI>}
   */
  async setPaswword(userId: string, newPassword: string): Promise<MessageResponseI> {
    const user = await this.usersService.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException('Usuario no existe');
    }
    await this.usersService.update({ id: userId }, { passwordu: this.cryptoService.createPassword(newPassword) });
    return { message: 'password changed' };
  }

  /**
   * Cambiar El Privilegio de Admin
   * @param {string} userId Id de Usuario
   * @param {boolean} admin Nuevo Valor
   * @returns {Promise<MessageResponseI>}
   */
  async setAdmin(userId: string, admin: boolean): Promise<MessageResponseI> {
    const user = await this.usersService.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException('Usuario no existe');
    }
    await this.usersService.update({ id: userId }, { isadmin: admin });
    this.system.emitChangeUsersUpdates();
    return { message: 'user type changed' };
  }

  /**
   * Obtener Todos Loa usuarios
   * @returns {UserL} Lista de Usuarios
   */
  async userList(): Promise<UserL[]> {
    const users = await this.usersService.findAll();

    return users.map((u) => ({ id: u.id, username: u.username, admin: u.isadmin }));
  }

  /**
   * Obtener las api keys de un usuario
   * @param {UserPayload} user datos de usuario
   */
  async getApiKeys(user: UserPayload): Promise<ApiKeysResponseI> {
    const apiKeys = await this.sessionsService.getApiKeysByUserId(user.userId);
    return { data: apiKeys, total: apiKeys.length };
  }

  /**
   * Obtener las sesiones de un usuario
   * @param {UserPayload} user datos de usuario
   */
  async getSessions(user: UserPayload): Promise<SessionsResponseI> {
    const sessions = await this.sessionsService.getSessionsByUserId(user.userId);
    return { data: sessions, total: sessions.length };
  }
}
