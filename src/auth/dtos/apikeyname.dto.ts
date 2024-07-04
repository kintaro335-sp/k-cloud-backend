import { IsString, IsNotEmpty } from 'class-validator';

export class ApiKeyNameDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
