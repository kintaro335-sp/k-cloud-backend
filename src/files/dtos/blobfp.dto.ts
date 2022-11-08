import { IsString, IsBase64, IsNumber, IsPositive } from 'class-validator';

export class BlobFPDTO {
  @IsNumber()
  @IsPositive()
  position: number;
  @IsBase64()
  @IsString()
  blob: string;
}
