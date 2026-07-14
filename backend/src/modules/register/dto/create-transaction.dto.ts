import { IsNumber, IsNotEmpty, IsString, IsIn, IsPositive } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto del movimiento debe ser mayor a 0' })
  amount: number;

  @IsString({ message: 'El tipo de movimiento debe ser texto' })
  @IsIn(['INGRESO', 'EGRESO'], { message: 'El tipo de movimiento debe ser INGRESO o EGRESO' })
  type: string;

  @IsString({ message: 'La descripción debe ser texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description: string;
}
