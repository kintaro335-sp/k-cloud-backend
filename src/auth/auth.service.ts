import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// services
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { CryptoService } from '../crypto/crypto.service';
import { FilesService } from '../files/files.service';
import { SystemService } from '../system/system.service';
// interfaces
import { UserPayload } from './interfaces/userPayload.interface';
import { ApiKeysResponse, SessionsResponse } from './interfaces/apikey.interface';
import { MessageResponse, AuthResponse } from './interfaces/response.interface';
import { UserL } from '../users/interfaces/userl.interface';

/**
 * @class Servicio de Autenticacion
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private filesService: FilesService,
    private sessionsService: SessionsService,
    private system: SystemService
  ) {}

  /**
   * Crear un usuario con un usuario y contraseña
   * @param {string} userName Nombre del usuario
   * @param {string} pasword contraseña en texto plano
   * @returns {Promise<AuthResponse>} Token de Auth por JWT
   */
  async login(userName: string, pasword: string, device: string = ''): Promise<AuthResponse> {
    const user = await this.usersService.findOne({ username: userName });
    if (!user) {
      throw new BadRequestException('Usuario o contraseña incorrectos');
    }
    if (this.cryptoService.comparePasswords(pasword, user.passwordu)) {
      const newSessionId = this.sessionsService.createSesionId();
      const payload: UserPayload = { sessionId: newSessionId, userId: user.id, username: user.username, isadmin: user.isadmin };
      await this.sessionsService.createSession(newSessionId, payload, device);
      this.system.emitChangeSessions(user.id);
      return {
        access_token: this.jwtService.sign(payload)
      };
    }
    throw new BadRequestException('Usuario o contraseña incorrectos');
  }

  /**
   * Crear un api key de un usuario con apikey
   * @param {UserPayload} user datos de usuario
   * @returns {Promise<AuthResponse>} apikey
   * */
  async createApiKey(user: UserPayload, name: string): Promise<AuthResponse> {
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
   * @returns {Promise<AuthResponse>} el Access Token del Usuario
   */
  async register(userName: string, pasword: string, device: string = ''): Promise<AuthResponse> {
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
   * @returns {Promise<MessageResponse>}
   */
  async logout(sessionId: string): Promise<MessageResponse> {
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
   * @returns {Promise<AuthResponse>} el Access Token del Usuario
   */
  async registerAdmin(userName: string, pasword: string): Promise<AuthResponse & { idUser: string }> {
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
   * @returns {Promise<MessageResponse>}
   */
  async deleteUser(userid: string): Promise<MessageResponse> {
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
   * @returns {Promise<MessageResponse>}
   */
  async changePassword(userId: string, password: string, newPassword: string): Promise<MessageResponse> {
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
   * @returns {Promise<MessageResponse>}
   */
  async setPaswword(userId: string, newPassword: string): Promise<MessageResponse> {
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
   * @returns {Promise<MessageResponse>}
   */
  async setAdmin(userId: string, admin: boolean): Promise<MessageResponse> {
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
  async getApiKeys(user: UserPayload): Promise<ApiKeysResponse> {
    const apiKeys = await this.sessionsService.getApiKeysByUserId(user.userId);
    return { data: apiKeys, total: apiKeys.length };
  }

  /**
   * Obtener las sesiones de un usuario
   * @param {UserPayload} user datos de usuario
   */
  async getSessions(user: UserPayload): Promise<SessionsResponse> {
    const sessions = await this.sessionsService.getSessionsByUserId(user.userId);
    return { data: sessions, total: sessions.length };
  }
}
