import { IsString } from 'class-validator';

export class RegisterDTO {
  @IsString()
  username: string;
  @IsString()
  password: string;
}
