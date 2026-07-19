import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSupplierDto {
  @IsString({ message: 'El nombre del proveedor debe ser texto' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'El teléfono debe ser texto' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'La dirección debe ser texto' })
  @IsOptional()
  address?: string;

  @IsString({ message: 'Los días de pedido deben ser texto' })
  @IsOptional()
  orderDays?: string;

  @IsString({ message: 'Los días de entrega deben ser texto' })
  @IsOptional()
  deliveryDays?: string;

  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  @IsOptional()
  isActive?: boolean;
}
