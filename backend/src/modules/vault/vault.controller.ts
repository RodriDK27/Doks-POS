import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { VaultService } from './vault.service';
import { RecordVaultTransactionDto, AdjustVaultBalanceDto } from './dto/record-vault-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('vault')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get()
  @Roles('ADMIN')
  getVaultState() {
    return this.vaultService.getVaultState();
  }

  @Get('transactions')
  @Roles('ADMIN')
  getTransactions(
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.vaultService.getTransactions(type, startDate, endDate);
  }

  @Get('profit-report')
  @Roles('ADMIN')
  getProfitReport(@Query('period') period?: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL') {
    return this.vaultService.getProfitReport(period);
  }

  @Post('transaction')
  @Roles('ADMIN')
  recordTransaction(@Body() dto: RecordVaultTransactionDto) {
    return this.vaultService.recordTransaction(dto);
  }

  @Post('adjust')
  @Roles('ADMIN')
  adjustBalance(@Body() dto: AdjustVaultBalanceDto) {
    return this.vaultService.adjustBalance(dto);
  }
}
