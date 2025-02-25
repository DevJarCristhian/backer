import { Injectable } from '@nestjs/common';
import { CreateChildDto } from '../dto/create-child.dto';
import { PrismaService } from '../../prisma.service';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';
import { CreateParentDto } from '../dto/create-parent.dto';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllChilds(dto: GetDTO) {
    const { search, perPage, page } = dto;
    const searchQuery = search
      ? Prisma.sql`
             AND (
              mh.descripcion LIKE ${`%${search}%`} OR
              mp.descripcion LIKE ${`%${search}%`}
             )
           `
      : Prisma.sql``;

    const query = Prisma.sql`
         SELECT
           mh.id,
           mh.id_cab AS maintenanceId,
           mp.descripcion AS category,
           mh.descripcion AS description,
           mh.estado AS status
         FROM mantenimiento_hijos AS mh
         INNER JOIN mantenimiento_padres AS mp ON mp.id = mh.id_cab 
         WHERE 1=1 ${searchQuery}
         ORDER BY mp.descripcion ASC, mh.descripcion ASC
         LIMIT ${parseInt(perPage)} OFFSET ${(parseInt(page) - 1) * parseInt(perPage)};
       `;

    const serializedData = await this.prisma.$queryRaw(query);
    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    const totalQuery = Prisma.sql`SELECT COUNT(*) AS total FROM mantenimiento_hijos AS mh
     INNER JOIN mantenimiento_padres AS mp ON mp.id = mh.id_cab
     WHERE 1=1 ${searchQuery}`;

    const totalResult = await this.prisma.$queryRaw(totalQuery);

    const total = Number(totalResult[0].total);
    const last_page = Math.ceil(total / parseInt(perPage));

    return {
      data,
      total,
      last_page,
    };
  }

  async createChild(dto: CreateChildDto) {
    const getLastId = Prisma.sql`
      SELECT MAX(id) AS lastId FROM mantenimiento_hijos;
    `;
    const result = await this.prisma.$queryRaw<any[]>(getLastId);

    const lastId = result[0].lastId ? parseInt(result[0].lastId.toString()) : 0;
    const newId = lastId + 1;

    const query = Prisma.sql`
      INSERT INTO mantenimiento_hijos (
        id_cab,
        descripcion,
        estado,
        id
      ) VALUES (
        ${dto.maintenanceId},
        ${dto.description},
        ${dto.status},
        ${newId}
      );
    `;

    await this.prisma.$queryRaw(query);

    return 'Child created successfully';
  }

  async updateChild(id: number, dto: CreateChildDto) {
    const query = Prisma.sql`
       UPDATE mantenimiento_hijos
       SET
       descripcion = ${dto.description},
       estado = ${dto.status}
       WHERE id = ${id} AND id_cab = ${dto.maintenanceId};
     `;

    await this.prisma.$queryRaw(query);

    return 'Child updated successfully';
  }

  async findAllParents() {
    const query = Prisma.sql`
        SELECT
          id as value,
          descripcion AS label
        FROM mantenimiento_padres
        ORDER BY id DESC;
      `;

    const serializedData = await this.prisma.$queryRaw(query);
    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    const parsedData = data.map((item: any) => ({
      ...item,
      value: parseInt(item.value),
    }));

    return parsedData;
  }

  async createParent(dto: CreateParentDto) {
    const getLastId = Prisma.sql`
    SELECT MAX(id) AS lastId FROM mantenimiento_padres;
  `;
    const result = await this.prisma.$queryRaw<any[]>(getLastId);

    const lastId = result[0].lastId ? parseInt(result[0].lastId.toString()) : 0;
    const newId = lastId + 1;

    const query = Prisma.sql`
    INSERT INTO mantenimiento_padres (
      descripcion,
      estado,
      id
    ) VALUES (
      ${dto.description},
      1,
      ${newId}
    );
  `;

    await this.prisma.$queryRaw(query);

    const newObject = {
      value: newId,
      label: dto.description,
    };

    return newObject;
  }

  async updateParent(id: number, dto: CreateParentDto) {
    await this.prisma.$queryRaw`
    UPDATE mantenimiento_padres
    SET descripcion = ${dto.description}, estado = 1
    WHERE id = ${id};
  `;

    const updatedRecords = (await this.prisma.$queryRaw`
    SELECT id, descripcion
    FROM mantenimiento_padres
    WHERE id = ${id};
  `) as [{ id: bigint; descripcion: string }];

    if (updatedRecords.length > 0) {
      const updatedRecord = updatedRecords[0];
      const updatedObject = {
        value: parseInt(updatedRecord.id.toString()),
        label: updatedRecord.descripcion,
      };
      return updatedObject;
    } else {
      throw new Error('No se pudo actualizar el registro');
    }
  }
}
