import { IsInt, IsString, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateTestimonialDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}