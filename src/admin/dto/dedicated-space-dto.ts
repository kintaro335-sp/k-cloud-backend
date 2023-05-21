import { IsNumber, IsString, Contains } from 'class-validator';
import { UnitByte } from '../interfaces/config.interface';

export class DedicatedSpaceDTO {
  @IsNumber()
  quantity: number;
  @IsString()
  unitTipe: UnitByte;
}
