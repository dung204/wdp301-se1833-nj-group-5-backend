import { DataSource } from 'typeorm';

import { configs } from './config.service';

export const dataSource = new DataSource(configs.POSTGRES);
