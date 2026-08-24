import { Module } from '@nestjs/common';
import { DailyTemplatesService } from './daily-templates.service';
import { DailyTemplatesController } from './daily-templates.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DailyTemplatesController],
  providers: [DailyTemplatesService],
  exports: [DailyTemplatesService],
})
export class DailyTemplatesModule {}
