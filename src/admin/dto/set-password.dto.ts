import { IsString } from 'class-validator';

export class SetPasswordDTO {
  @IsString()
  password: string;
}
