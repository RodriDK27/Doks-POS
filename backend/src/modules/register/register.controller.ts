import { Controller, Get, Post, Body, Param, BadRequestException, UseGuards } from '@nestjs/common';
import { RegisterService } from './register.service';
import { OpenRegisterDto } from './dto/open-register.dto';
import { CloseRegisterDto } from './dto/close-register.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('register')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Post('open')
  open(@Body() openRegisterDto: OpenRegisterDto) {
    return this.registerService.open(openRegisterDto);
  }

  @Get('active')
  getActive() {
    return this.registerService.getActive();
  }

  @Post('close')
  close(@Body() closeRegisterDto: CloseRegisterDto) {
    return this.registerService.close(closeRegisterDto);
  }

  @Post('transaction')
  createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.registerService.createTransaction(createTransactionDto);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.registerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registerService.findOne(id);
  }
}
