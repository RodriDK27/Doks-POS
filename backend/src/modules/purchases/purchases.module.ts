import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { RegisterModule } from '../register/register.module';
import { VaultModule } from '../vault/vault.module';

@Module({
  imports: [RegisterModule, VaultModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
