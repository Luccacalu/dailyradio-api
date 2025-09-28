import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findUserStations(userId: string) {
    return this.prisma.station.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async verifyUser(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        status: 'ACTIVE',
        emailVerificationToken: null,
        emailTokenExpiresAt: null,
      },
    });
  }

  async updateVerificationToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailTokenExpiresAt: expiresAt,
      },
    });
  }
}
