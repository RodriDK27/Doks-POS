import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class OpenRegisterDto {
  @IsString({ message: 'El nombre del cajero debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del cajero es obligatorio' })
  openedBy: string;

  @IsNumber({}, { message: 'El balance inicial debe ser un número' })
  @Min(0, { message: 'El balance inicial no puede ser menor a 0' })
  initialBalance: number;
}
