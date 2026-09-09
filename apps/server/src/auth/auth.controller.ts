import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Role } from '@dexcel/shared';
import { AuthService, SESSION_COOKIE } from './auth.service';

function readSid(request: Request): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=');
  }
  return undefined;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 登录：username + password + role（页面选择的登录身份） */
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { username?: string; password?: string; role?: Role },
    @Res({ passthrough: true }) response: Response,
  ) {
    const { username, password, role } = body ?? {};
    if (!username || !password || (role !== 'admin' && role !== 'user')) {
      throw new UnauthorizedException('请填写账号、密码并选择登录身份');
    }
    const { sid, ...user } = await this.authService.login(username, password, role);
    response.cookie(SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60 * 1000,
    });
    return { user };
  }

  /** 注册：仅开放普通用户注册，成功后直接建立会话 */
  @Post('register')
  @HttpCode(200)
  async register(
    @Body() body: { username?: string; password?: string; displayName?: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const { username, password, displayName } = body ?? {};
    if (!username || !password) {
      throw new UnauthorizedException('请填写账号和密码');
    }
    const { sid, ...user } = await this.authService.register(username, password, displayName ?? '');
    response.cookie(SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60 * 1000,
    });
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    this.authService.logout(readSid(request));
    response.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  me(@Req() request: Request) {
    const user = this.authService.getUserBySid(readSid(request));
    if (!user) throw new UnauthorizedException('未登录或会话已过期');
    return { user };
  }
}
