import { Module } from '@nestjs/common';
import { RegisterService } from './register.service';
import { RegisterController } from './register.controller';

@Module({
  controllers: [RegisterController],
  providers: [RegisterService],
  exports: [RegisterService], // Exportamos para que Ventas ajuste balances de caja
})
export class RegisterModule {}
