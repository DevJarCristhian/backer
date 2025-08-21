import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DataService {
  constructor(private readonly prisma: PrismaService) { }

  async findCountries() {
    const query = Prisma.sql`
    SELECT
      p.id AS value,
      p.nombre AS label
    FROM paises AS p
  `;

    const serializedData = await this.prisma.$queryRaw(query);

    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      )
    );

    data.forEach(item => {
      if (item.value) {
        item.value = Number(item.value);
      }
    });

    return data;
  }

}
