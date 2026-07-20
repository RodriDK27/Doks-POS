import { Module } from '@nestjs/common';
import { RequestedProductsService } from './requested-products.service';
import { RequestedProductsController } from './requested-products.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RequestedProductsController],
  providers: [RequestedProductsService],
  exports: [RequestedProductsService],
})
export class RequestedProductsModule {}
