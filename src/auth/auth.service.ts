import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // Placeholder: real implementation will verify bcrypt hash or legacy DES fallback (D-014)
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      profileId: user.profileId,
      userTypeId: user.userTypeId,
    };

    return {
      data: {
        accessToken: this.jwtService.sign(payload),
        refreshToken: 'opaque-token-placeholder',
        expiresIn: 900,
        mustChangePassword: user.mustChangePassword,
        user: {
          id: user.id,
          username: user.username,
          userTypeId: user.userTypeId,
          profileId: user.profileId,
        },
      },
      message: { code: 'OK', text: 'Login successful' },
    };
  }
}
