import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Note } from './interfaces/note.interface';
import { v4 as uuidv4 } from 'uuid';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class NotesService {
  private notes: Note[] = [];
  private dataPath = join(process.cwd(), 'data', 'notes.json');
  private logger = new Logger(NotesService.name);

  constructor() {
  
    this.loadFromFile().catch(err => {
      this.logger.error('Failed to load notes.json', err);
    });
  }

  private async loadFromFile() {
    try {
      const raw = await fs.readFile(this.dataPath, 'utf-8');
      this.notes = JSON.parse(raw) as Note[];
    } catch (err) {
  
      this.notes = [];
      await this.saveToFile(); 
    }
  }

  private async saveToFile() {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(this.dataPath, JSON.stringify(this.notes, null, 2), 'utf-8');
  }

  findAll(): Note[] {
    return [...this.notes].sort((a, b) => {
      if ((b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) !== 0) {
        return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async create(dto: CreateNoteDto): Promise<Note> {
    const note: Note = {
      id: uuidv4(),
      title: dto.title,
      content: dto.content || '',
      createdAt: new Date().toISOString(),
      isPinned: !!dto.isPinned,
      category: dto.category || 'Other',

    };
    this.notes.push(note);
    await this.saveToFile();
    return note;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const index = this.notes.findIndex(n => n.id === id);
    if (index === -1) throw new NotFoundException('Note not found');
    this.notes.splice(index, 1);
    await this.saveToFile();
    return { deleted: true };
  }

  async update(id: string, dto: UpdateNoteDto): Promise<Note> {
    const note = this.notes.find(n => n.id === id);
    if (!note) throw new NotFoundException('Note not found');
    if (dto.title !== undefined) note.title = dto.title;
    if (dto.content !== undefined) note.content = dto.content;
    if (dto.isPinned !== undefined) note.isPinned = dto.isPinned;
    if (dto.category !== undefined) note.category = dto.category;

    await this.saveToFile();
    return note;
  }
}
