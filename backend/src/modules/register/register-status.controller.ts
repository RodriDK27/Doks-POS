import { Controller, Get } from '@nestjs/common';
import { RegisterService } from './register.service';

/**
 * Sin token a propósito: solo dice si hay una caja abierta (sin montos ni movimientos).
 * Sirve para que, si la sesión se cerró, la app pida el PIN en vez de mostrar "abrir caja".
 */
@Controller('register-status')
export class RegisterStatusController {
  constructor(private readonly registerService: RegisterService) {}

  @Get()
  async getStatus() {
    return { open: await this.registerService.isOpen() };
  }
}
