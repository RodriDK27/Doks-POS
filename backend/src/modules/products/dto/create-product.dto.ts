import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'El código de barras debe ser texto' })
  @IsOptional()
  barcode?: string;

  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString({ message: 'La descripción debe ser texto' })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'El precio de compra debe ser un número' })
  @Min(0, { message: 'El precio de compra no puede ser menor a 0' })
  purchasePrice: number;

  @IsNumber({}, { message: 'El precio de venta debe ser un número' })
  @Min(0, { message: 'El precio de venta no puede ser menor a 0' })
  sellPrice: number;

  @IsNumber({}, { message: 'El precio de mayoreo debe ser un número' })
  @Min(0, { message: 'El precio de mayoreo no puede ser menor a 0' })
  @IsOptional()
  wholesalePrice?: number;

  @IsNumber({}, { message: 'La existencia (stock) debe ser un número' })
  @Min(0, { message: 'La existencia no puede ser menor a 0' })
  stock: number;

  @IsNumber({}, { message: 'El stock mínimo debe ser un número' })
  @Min(0, { message: 'El stock mínimo no puede ser menor a 0' })
  @IsOptional()
  minStock?: number;

  @IsString({ message: 'La categoría debe ser texto' })
  @IsOptional()
  category?: string;
}
