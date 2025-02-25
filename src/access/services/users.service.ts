import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        password: false,
        status: true,
        whatsappId: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            description: true,
            id: true,
          },
        },
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.findOneByEmail(createUserDto.email);
    if (user) {
      throw new BadRequestException('User already exists');
    }

    createUserDto.password = await this.hashPassword(createUserDto.password);
    await this.prisma.users.create({ data: createUserDto });

    return 'User created Successfully';
  }

  async update(id: number, updateUserDto: CreateUserDto) {
    await this.prisma.users.update({ data: updateUserDto, where: { id: id } });
    return 'User update Successfully';
  }

  findProfileWithPassword(email: string) {
    return this.prisma.users.findUnique({
      where: { email: email },
      select: { id: true, name: true, email: true, password: true, role: true },
    });
  }

  async findOneByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email: email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        roleId: true,
      },
    });
  }

  async hashPassword(password: String) {
    const pass = await bcrypt.hash(password, 10);
    return pass;
  }

  async getUser(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: {
                  include: {
                    children: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.description,
      permissions: user.role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        actions: rp.permission.children.map((child) => child.name),
      })),
    };

    return result;
  }

  findOne(id: number) {
    return this.prisma.users.findUnique({ where: { id: id } });
  }
}
