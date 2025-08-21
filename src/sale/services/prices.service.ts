import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { UpdatePriceDto } from '../dto/prices/update-prices.dto';

@Injectable()
export class PricesService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(dto: GetDTO) {
    const { search, perPage, page, country } = dto;

    let filterQuery = Prisma.sql``;

    const searchQuery = search
      ? Prisma.sql`
            AND (
              c.cadena LIKE ${`%${search}%`} OR
              pro.nombre LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    if (country && country != 0) {
      filterQuery = Prisma.sql`${filterQuery} AND lp.id_pais = ${country}`;
    }

    const query = Prisma.sql`
      SELECT
        lp.id,
        lp.id_cadena AS chainId,
        p.nombre AS countryName,
        pro.nombre AS productName,
        c.cadena AS chainName,
        lp.id_moneda AS currencyId,
        lp.precio AS price,
        lp.estado AS status
      FROM 
        lista_precios AS lp
      LEFT JOIN paises AS p ON lp.id_pais = p.id
      LEFT JOIN productos AS pro ON lp.id_producto = pro.id
      LEFT JOIN cadena AS c ON lp.id_cadena = c.id
      WHERE 1=1 ${searchQuery} ${filterQuery}
      ORDER BY pro.nombre ASC
      LIMIT ${parseInt(perPage)} OFFSET ${(parseInt(page) - 1) * parseInt(perPage)};
    `;

    const serializedData = await this.prisma.$queryRaw(query);
    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    const totalQuery = Prisma.sql`SELECT COUNT(*) AS total 
    FROM lista_precios AS lp
    LEFT JOIN paises AS p ON lp.id_pais = p.id
    LEFT JOIN productos AS pro ON lp.id_producto = pro.id
    LEFT JOIN cadena AS c ON lp.id_cadena = c.id
    WHERE 1=1 ${searchQuery} ${filterQuery}`;

    const totalResult = await this.prisma.$queryRaw(totalQuery);

    const total = Number(totalResult[0].total);
    const last_page = Math.ceil(total / parseInt(perPage));

    return {
      data,
      total,
      last_page,
    };
  }

  async getAllPricess(dto: GetDTO) {
    const { search, country } = dto;

    let filterQuery = Prisma.sql``;
    const searchQuery = search
      ? Prisma.sql`
            AND (
              c.cadena LIKE ${`%${search}%`} OR
              pro.nombre LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    if (country && country != 0) {
      filterQuery = Prisma.sql`${filterQuery} AND lp.id_pais = ${country}`;
    }

    const query = Prisma.sql`
        SELECT
          pro.nombre AS productName,
          c.cadena AS chainName,
          p.nombre AS countryName,
          lp.precio AS price,
          lp.id_moneda AS currencyId,
          lp.estado AS status
        FROM
        lista_precios AS lp
        LEFT JOIN paises AS p ON lp.id_pais = p.id
        LEFT JOIN productos AS pro ON lp.id_producto = pro.id
        LEFT JOIN cadena AS c ON lp.id_cadena = c.id
        WHERE 1=1 ${searchQuery} ${filterQuery}
        ORDER BY pro.nombre ASC
      `;

    const data = await this.prisma.$queryRaw(query);
    return data;
  }

  async exportToExcel(dto: GetDTO) {
    const data = (await this.getAllPricess(dto)) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista');
    worksheet.columns = [
      { header: 'Producto', key: 'productName', width: 40 },
      { header: 'Cadena', key: 'chainName', width: 40 },
      { header: 'Pais', key: 'countryName', width: 40 },
      { header: 'Precio', key: 'price', width: 40 },
    ];

    data.forEach((v) => {
      worksheet.addRow({
        productName: v.productName,
        chainName: v.chainName,
        countryName: v.countryName,
        price: v.price,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async updatePrice(user: number, id: number, dto: UpdatePriceDto) {
    console.log(dto);

    const query = Prisma.sql`
        UPDATE lista_precios
        SET
        precio = ${dto.price}
        WHERE id = ${id} AND id_cadena = ${dto.chainId};
      `;

    await this.prisma.$queryRaw(query);

    return 'Precio actualizado correctamente';
  }
}
