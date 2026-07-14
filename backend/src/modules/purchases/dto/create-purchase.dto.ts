import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseItemDto {
  @IsString({ message: 'El ID del producto debe ser texto' })
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  productId: string;

  @IsNumber({}, { message: 'El precio de costo debe ser un número' })
  @Min(0, { message: 'El precio de costo no puede ser menor a 0' })
  costPrice: number;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.001, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;
}

export class CreatePurchaseDto {
  @IsString({ message: 'El ID del proveedor debe ser texto' })
  @IsNotEmpty({ message: 'El ID del proveedor es obligatorio' })
  supplierId: string;

  @IsBoolean({ message: 'El pago desde caja debe ser un valor booleano' })
  @IsOptional()
  payFromRegister?: boolean;

  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;

  @IsArray({ message: 'Los artículos comprados deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}
