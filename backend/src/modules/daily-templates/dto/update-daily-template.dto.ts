import { PartialType } from '@nestjs/mapped-types';
import { CreateDailyTemplateDto } from './create-daily-template.dto';

export class UpdateDailyTemplateDto extends PartialType(CreateDailyTemplateDto) {}
