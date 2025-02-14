import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
} from '@nestjs/common';
import { UsersService } from './services/users.service';
import { RolesService } from './services/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ActiveUser } from '../common/decorators/active-user.decorator';
import { UserActiveI } from 'src/common/interfaces/user-active.interface';
import { CreateRoleDto } from './dto/create-role.dto';

@UseGuards(AuthGuard)
@Controller('access')
export class AccessController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
  ) {}

  @Get('users')
  findAllUsers() {
    return this.usersService.findAll();
  }

  @Post('users')
  createUser(
    @ActiveUser() user: UserActiveI,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(createUserDto);
  }

  @Put('users/:id')
  updateUser(
    @ActiveUser() user: UserActiveI,
    @Param('id') id: string,
    @Body() updateUserDto: CreateUserDto,
  ) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Get('users/roles')
  getRoles() {
    return this.rolesService.getRoles();
  }

  @Get('roles')
  findAllRoles() {
    return this.rolesService.findAll();
  }

  @Post('roles')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Put('roles/:id')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: CreateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Get('roles/permissions')
  getPermissions() {
    return this.rolesService.getPermissions();
  }
}
