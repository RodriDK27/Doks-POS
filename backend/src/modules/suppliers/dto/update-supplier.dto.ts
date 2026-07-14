import { IsString, IsOptional } from 'class-validator';

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
}
