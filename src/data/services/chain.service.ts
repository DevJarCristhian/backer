import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ChainService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(dto: GetDTO) {
    const { search, perPage, page, country } = dto;

    let filterQuery = Prisma.sql``;
    const searchQuery = search
      ? Prisma.sql`
            AND (
              c.cadena LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    if (country && country != 0) {
      filterQuery = Prisma.sql`${filterQuery} AND c.id_pais = ${country}`;
    }

    const query = Prisma.sql`
        SELECT
          c.id,
          c.cadena AS chain,
          COALESCE(p.nombre, '-') AS countryName
        FROM
        cadena AS c
        LEFT JOIN paises AS p ON c.id_pais = p.id
        WHERE 1=1 ${searchQuery} ${filterQuery}
        ORDER BY c.cadena ASC
        LIMIT ${parseInt(perPage)} OFFSET ${(parseInt(page) - 1) * parseInt(perPage)};
      `;

    const serializedData = await this.prisma.$queryRaw(query);
    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    const totalQuery = Prisma.sql`
        SELECT
          COUNT(*) AS total
        FROM
        cadena AS c
        LEFT JOIN paises AS p ON c.id_pais = p.id
        WHERE 1=1 ${searchQuery} ${filterQuery}
      `;

    const totalResult = await this.prisma.$queryRaw(totalQuery);
    const total = Number(totalResult[0].total);
    const last_page = Math.ceil(total / parseInt(perPage));

    return {
      data,
      total,
      last_page,
    };
  }

  async getAllChains(dto: GetDTO) {
    const { search, country } = dto;

    let filterQuery = Prisma.sql``;
    const searchQuery = search
      ? Prisma.sql`
            AND (
              c.cadena LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    if (country && country != 0) {
      filterQuery = Prisma.sql`${filterQuery} AND c.id_pais = ${country}`;
    }

    const query = Prisma.sql`
        SELECT
          c.cadena,
          p.nombre AS countryName
        FROM
        cadena AS c
        LEFT JOIN paises AS p ON c.id_pais = p.id
        WHERE 1=1 ${searchQuery} ${filterQuery}
        ORDER BY c.cadena ASC`;

    const data = await this.prisma.$queryRaw(query);
    return data;
  }

  async exportToExcel(dto: GetDTO) {
    const data = (await this.getAllChains(dto)) as any[];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista');
    worksheet.columns = [
      { header: 'Cadena', key: 'cadena', width: 40 },
      { header: 'Pais', key: 'countryName', width: 40 },
    ];

    data.forEach((v) => {
      worksheet.addRow({
        cadena: v.cadena,
        countryName: v.countryName,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
