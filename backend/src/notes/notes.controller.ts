import { Body, Controller, Delete, Get, Param, Post, Put,Req  } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UnauthorizedException } from '@nestjs/common';


@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

   @Get()
  getAll(@Req() req: Request & { userId?: string }) {
    return this.notesService.findAll(req.userId);
  }

   @Post()
  create(@Body() dto: CreateNoteDto, @Req() req: Request & { userId?: string }) {
    const userId = req.userId;
    if (!userId) throw new UnauthorizedException();
    return this.notesService.create(dto, userId);
  }

   @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto, @Req() req: Request & { userId?: string }) {
    const userId = req.userId;
    if (!userId) throw new UnauthorizedException();
    return this.notesService.update(id, dto, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: Request & { userId?: string }) {
    const userId = req.userId;
    if (!userId) throw new UnauthorizedException();
    return this.notesService.remove(id, userId);
  }
}
