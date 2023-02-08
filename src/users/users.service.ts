import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtener todos los Usuarios
   * @returns {User[]}
   */
  async findAll(): Promise<User[] | null> {
    return this.prisma.user.findMany();
  }

  /**
   * Encontrar usuarios a partir de ciertos criterios
   * @param {UserWhereInput} userWhere
   * @returns {User[] | null}
   */
  async findMany(userWhere: Prisma.UserWhereInput): Promise<User[] | null> {
    return this.prisma.user.findMany({ where: userWhere });
  }

  /**
   * Obtener un Solo usuario a partir de un criterio
   * @param {Prisma.UserWhereUniqueInput} userWhereUnique
   * @returns {User | null}
   */
  async findOne(userWhereUnique: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({ where: userWhereUnique });
  }

  /**
   * Crea un nuevo usuario
   * @param {Prisma.UserCreateInput} user
   * @returns {User}
   */
  async create(user: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data: user });
  }

  /**
   * Actualizar los datos de un usuario
   * @param {Prisma.UserWhereUniqueInput} userWhereUnique Where para encontrar un unico registro 
   * @param {User} user usuario a guardar
   * @returns {User}
   */
  async update(userWhereUnique: Prisma.UserWhereUniqueInput, user: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: userWhereUnique, data: user });
  }

  /**
   * Eliminar un solo usuario
   * @param {Prisma.UserWhereUniqueInput} userWhereUnique Where de la consulta
   * @returns {Promise<User>}
   */
  async delete(userWhereUnique: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({ where: userWhereUnique });
  }

}
