import { Injectable } from '@nestjs/common';
import { Prisma, Session, User } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async createSession(
    data: Prisma.SessionUncheckedCreateInput,
  ): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  async deleteSession(sessionId: string) {
    return this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async deleteAllUserSessions(userId: string) {
    return this.prisma.session.deleteMany({
      where: { userId: userId },
    });
  }

  async findByUsername(username: string) {
    const usernameCanonical = username.toLowerCase();
    return this.prisma.user.findUnique({
      where: { username: usernameCanonical },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        imageUrl: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
