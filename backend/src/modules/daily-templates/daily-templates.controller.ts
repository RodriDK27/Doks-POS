import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DailyTemplatesService } from './daily-templates.service';
import { CreateDailyTemplateDto } from './dto/create-daily-template.dto';
import { UpdateDailyTemplateDto } from './dto/update-daily-template.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('daily-templates')
@UseGuards(JwtAuthGuard)
export class DailyTemplatesController {
  constructor(private readonly dailyTemplatesService: DailyTemplatesService) {}

  @Get()
  findAll() {
    return this.dailyTemplatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dailyTemplatesService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateDailyTemplateDto) {
    return this.dailyTemplatesService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDailyTemplateDto) {
    return this.dailyTemplatesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dailyTemplatesService.remove(id);
  }
}
