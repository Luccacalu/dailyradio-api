import { ApiProperty } from '@nestjs/swagger';
import { StationRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export enum StationRoleDto {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'O novo cargo a ser atribuído ao membro.',
    enum: StationRoleDto,
    example: StationRoleDto.MODERATOR,
  })
  @IsEnum(StationRoleDto)
  role: StationRole;
}
