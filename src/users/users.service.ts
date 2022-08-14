import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[] | null> {
    return this.prisma.user.findMany();
  }

  async findMany(userWhere: Prisma.UserWhereInput): Promise<User[] | null> {
    return this.prisma.user.findMany({ where: userWhere });
  }

  async findOne(userWhereUnique: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({ where: userWhereUnique });
  }

  async create(user: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data: user });
  }

  async update(userWhereUnique: Prisma.UserWhereUniqueInput, user: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: userWhereUnique, data: user });
  }

  async delete(userWhereUnique: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({ where: userWhereUnique });
  }

}
