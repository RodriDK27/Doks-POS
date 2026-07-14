import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSupplierDto {
  @IsString({ message: 'El nombre del proveedor debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio' })
  name: string;

  @IsString({ message: 'El teléfono debe ser texto' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'La dirección debe ser texto' })
  @IsOptional()
  address?: string;
}
