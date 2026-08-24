import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDailyTemplateItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  defaultQty: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  defaultCost?: number;
}

export class CreateDailyTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDailyTemplateItemDto)
  items?: CreateDailyTemplateItemDto[];
}
