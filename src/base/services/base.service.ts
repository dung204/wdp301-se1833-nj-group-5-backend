import { Logger, NotFoundException } from '@nestjs/common';
import { Model, QueryOptions, RootFilterQuery } from 'mongoose';

import { User } from '@/modules/users/schemas/user.schema';

import { PaginationDto, QueryDto } from '../dtos';
import { BaseSchema } from '../schemas';

type FindManyOptions<TModel> = {
  queryDto?: QueryDto & Record<string, any>;
  filter?: RootFilterQuery<TModel>;
} & QueryOptions<TModel>;

export class BaseService<Schema extends BaseSchema> {
  protected logger: Logger;

  constructor(
    protected readonly model: Model<Schema>,
    logger: Logger,
  ) {
    this.logger = logger;
  }

  async find(options: FindManyOptions<Schema> = {}, currentUser?: User) {
    const preProcessedOptions = this.preFind(options, currentUser);
    const { queryDto, filter, projection, ...otherOptions } = preProcessedOptions;
    const data = (await this.model
      .find(filter ?? {}, null, otherOptions)
      .lean()
      .exec()) as Schema[];
    return this.postFind(data, preProcessedOptions, currentUser);
  }

  async findOne(filter: RootFilterQuery<Schema>, currentUser?: User) {
    const preProcessedOptions = this.preFindOne(filter, currentUser);
    const data = (await this.model.findOne(preProcessedOptions).lean().exec()) as Schema;
    return this.postFindOne(data, preProcessedOptions, currentUser);
  }

  async count(options: FindManyOptions<Schema> = {}, currentUser?: User) {
    const preProcessedOptions = this.preCount(options, currentUser);
    return this.model.countDocuments(preProcessedOptions);
  }

  async createOne(userId: string, createDto: Partial<Schema>) {
    const doc = this.preCreateOne(userId, createDto);
    const record = await this.model.create(doc);
    return this.postCreateOne(record, createDto);
  }

  async create(userId: string, createDtos: Partial<Schema>[]) {
    const docs = this.preCreate(userId, createDtos);
    const records = await this.model.create(...docs);
    return this.postCreate(records, createDtos);
  }

  async update(userId: string, updateDto: Partial<Schema>, filter?: RootFilterQuery<Schema>) {
    const oldRecords = await this.model.find(filter ?? {}).exec();

    if (oldRecords.length === 0) {
      throw new NotFoundException('Record(s) not found.');
    }

    const doc = this.preUpdate(userId, updateDto, oldRecords, filter);
    await this.model.updateMany(filter ?? {}, doc).exec();
    const newRecords = (await this.model
      .find(filter ?? {})
      .lean()
      .exec()) as Schema[];
    return this.postUpdate(newRecords, oldRecords, updateDto, filter);
  }

  async softDelete(
    /**
     * The ID of the user who perform the delete operation
     */
    userId: string,
    filter?: RootFilterQuery<Schema>,
  ) {
    this.preSoftDelete(userId, filter);
    const deletedRecords = await this.update(
      userId,
      {
        updateUserId: userId,
        deleteTimestamp: new Date(),
        deleteUserId: userId,
      } as unknown as Partial<Schema>,
      filter,
    );
    return this.postSoftDelete(deletedRecords, filter);
  }

  async restore(userId: string, options?: FindManyOptions<Schema>) {
    this.preRestore(userId, options);
    const deletedRecords = await this.update(
      userId,
      {
        deleteTimestamp: null,
        deleteUserId: null,
      } as unknown as Partial<Schema>,
      options,
    );
    return this.postRestore(deletedRecords, options);
  }

  /* ---------- Pre-processing functions ---------- */

  protected preFind(
    options: FindManyOptions<Schema>,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ): FindManyOptions<Schema> {
    const { limit, skip } = this.getPaginationProps(options);
    const sort = this.getSortProps(options);
    const filter = this.getFilterProps(options);

    return {
      ...options,
      filter,
      limit,
      skip,
      sort,
    };
  }

  protected preFindOne(
    filter: RootFilterQuery<Schema>,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ): RootFilterQuery<Schema> {
    return filter;
  }

  protected preCount(
    options: FindManyOptions<Schema>,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ): FindManyOptions<Schema> {
    const filter = this.getFilterProps(options);
    return {
      ...options,
      filter,
    };
  }

  protected preCreateOne(userId: string, createDto: any): Partial<Schema> {
    return {
      ...createDto,
      createUserId: userId,
      updateUserId: userId,
    };
  }

  protected preCreate(userId: string, createDtos: any[]): Partial<Schema>[] {
    return createDtos.map((dto) => ({
      ...dto,
      createUserId: userId,
      updateUserId: userId,
    }));
  }

  protected preUpdate(
    userId: string,
    updateDto: any,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _oldRecords: Schema[],
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _filter?: RootFilterQuery<Schema>,
  ): Partial<Schema> {
    return {
      ...updateDto,
      updateUserId: userId,
      updateTimestamp: new Date(),
    };
  }

  protected preSoftDelete(
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _userId: string,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _filter?: RootFilterQuery<Schema>,
  ) {}

  protected preRestore(
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _userId: string,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _options?: FindManyOptions<Schema>,
  ) {}

  /* ---------- Post-processing functions ---------- */

  protected async postFind(
    data: Schema[],
    options: FindManyOptions<Schema>,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ) {
    const { queryDto } = options;
    const { page, pageSize, order, ...filterKeys } = queryDto ?? {};

    return {
      data,
      metadata: {
        pagination: await this.getPaginationResponse(options),
        filters: filterKeys,
        order: (order ?? []).map((orderVal) => {
          const [field, direction] = orderVal.split(':');
          return { field, direction };
        }),
      },
    };
  }

  protected postFindOne(
    data: Schema | null,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _filter: RootFilterQuery<Schema>,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ) {
    return data;
  }

  protected postCreateOne(
    record: Schema,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _createDto: any,
  ) {
    return record;
  }

  protected postCreate(
    records: Schema[],
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _createDtos: any[],
  ) {
    return records;
  }

  protected postUpdate(
    newRecords: Schema[],
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _oldRecords: Schema[],
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _updateDto: any,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _filter?: RootFilterQuery<Schema>,
  ) {
    return newRecords;
  }

  protected postSoftDelete(deletedRecords: Schema[], _filter?: RootFilterQuery<Schema>) {
    return deletedRecords;
  }

  protected postRestore(restoredRecords: Schema[], _options?: FindManyOptions<Schema>) {
    return restoredRecords;
  }

  private getPaginationProps(options: FindManyOptions<Schema>) {
    const { queryDto } = options;
    const page = queryDto?.page || 1;
    const limit = queryDto?.pageSize || 10;
    const skip = (page - 1) * limit;
    return {
      limit,
      skip,
    };
  }

  private getSortProps(options: FindManyOptions<Schema>) {
    const { queryDto, order } = options;

    if (queryDto?.order) {
      return {
        ...order,
        ...Object.fromEntries(queryDto.order.map((o) => o.split(':'))),
      };
    }

    return order;
  }

  private getFilterProps(options: FindManyOptions<Schema>) {
    const { queryDto, filter } = options;

    const { page, pageSize, order, ...additionalFilters } = queryDto ?? {};

    return {
      ...filter,
      ...additionalFilters,
    };
  }

  private async getPaginationResponse(options: FindManyOptions<Schema>): Promise<PaginationDto> {
    const { queryDto, limit, skip, ...opts } = options;
    const page = queryDto?.page || 1;
    const pageSize = queryDto?.pageSize || 10;
    const total = await this.count(opts);
    const totalPage = Math.ceil(total / pageSize);

    return {
      currentPage: page,
      pageSize,
      total,
      totalPage,
      hasNextPage: page < totalPage,
      hasPreviousPage: page > 1,
    };
  }
}
