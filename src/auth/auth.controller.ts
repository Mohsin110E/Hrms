import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // TODO: revoke refresh token
    return { message: { code: 'OK', text: 'Logged out' } };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh() {
    // TODO: implement refresh rotation
    return { message: { code: 'OK', text: 'Refresh not yet implemented' } };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    // TODO: send reset email
    return { message: { code: 'OK', text: 'If the email exists, a reset link was sent' } };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword() {
    // TODO: validate token and set new password
    return { message: { code: 'OK', text: 'Reset not yet implemented' } };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword() {
    // TODO: current + new password
    return { message: { code: 'OK', text: 'Change password not yet implemented' } };
  }
}
