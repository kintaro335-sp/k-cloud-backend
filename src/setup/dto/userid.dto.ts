import { IsString } from 'class-validator';

export class userIdDTO {
  @IsString()
  userid: string;
}
