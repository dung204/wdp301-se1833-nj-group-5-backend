import { Logger, NotFoundException } from '@nestjs/common';
import { Model, QueryOptions, RootFilterQuery } from 'mongoose';

import { User } from '@/modules/users/schemas/user.schema';

import { PaginationDto, QueryDto } from '../dtos';
import { BaseSchema } from '../schemas';

export type FindManyOptions<TModel> = {
  queryDto?: QueryDto & Record<string, any>;
  filter?: RootFilterQuery<TModel>;
} & QueryOptions<TModel>;

/**
 * BaseService provides a generic, extensible service layer for CRUD operations on Mongoose models.
 *
 * This class implements common data access methods such as `find`, `findOne`, `count`, `createOne`, `create`, `update`, `softDelete`, and `restore`.
 * It also provides hooks for pre- and post-processing (e.g., `preFind`, `postCreateOne`) that can be overridden in derived classes for custom logic.
 *
 * @example
 * ```typescript
 * class UserService extends BaseService<UserSchema> {
 *   // Override hooks or add custom methods here
 * }
 * ```
 *
 * @template Schema - The Mongoose schema type for the service.
 *
 * @param model - The Mongoose model instance for the schema.
 * @param logger - Logger instance for logging operations.
 *
 * @method `find` - Retrieves multiple documents with optional filtering, pagination, and sorting.
 * @method `findOne` - Retrieves a single document matching the filter.
 * @method `count` - Counts documents matching the filter.
 * @method `createOne` - Creates a single document.
 * @method `create` - Creates multiple documents.
 * @method `update` - Updates documents matching the filter.
 * @method `softDelete` - Soft deletes documents by setting delete fields.
 * @method `restore` - Restores soft-deleted documents.
 */
export class BaseService<Schema extends BaseSchema> {
  protected logger: Logger;

  constructor(
    protected readonly model: Model<Schema>,
    logger: Logger,
  ) {
    this.logger = logger;
  }

  async find(options: FindManyOptions<Schema> = {}, currentUser?: User) {
    const preProcessedOptions = await this.preFind(options, currentUser);
    const { queryDto, filter, projection, ...otherOptions } = preProcessedOptions;
    const data = (await this.model
      .find(filter ?? {}, null, otherOptions)
      .lean()
      .exec()) as Schema[];
    return this.postFind(data, preProcessedOptions, currentUser);
  }

  async findOne(filter: RootFilterQuery<Schema>, currentUser?: User) {
    const preProcessedOptions = (await this.preFindOne(
      filter,
      currentUser,
    )) as RootFilterQuery<Schema>;
    const data = (await this.model.findOne(preProcessedOptions).lean().exec()) as Schema;
    return this.postFindOne(data, preProcessedOptions, currentUser);
  }

  async count(options: FindManyOptions<Schema> = {}, currentUser?: User) {
    const preProcessedOptions = await this.preCount(options, currentUser);
    return this.model.countDocuments(preProcessedOptions.filter);
  }

  async createOne(createDto: Partial<Schema>, _currentUser?: User) {
    const doc = await this.preCreateOne(createDto, _currentUser);
    const record = await this.model.create(doc);
    return this.postCreateOne(record, createDto, _currentUser);
  }

  async create(createDtos: Partial<Schema>[], _currentUser?: User) {
    const docs = await this.preCreate(createDtos, _currentUser);
    const records = await this.model.create(...docs);
    return this.postCreate(records, createDtos, _currentUser);
  }

  async update(updateDto: Partial<Schema>, filter?: RootFilterQuery<Schema>, currentUser?: User) {
    const oldRecords = await this.model.find(filter ?? {}).exec();

    if (oldRecords.length === 0) {
      throw new NotFoundException('Record(s) not found.');
    }

    const doc = await this.preUpdate(updateDto, oldRecords, filter, currentUser);
    await this.model.updateMany(filter ?? {}, doc).exec();
    const newRecords = (await this.model
      .find(filter ?? {})
      .lean()
      .exec()) as Schema[];
    return this.postUpdate(newRecords, oldRecords, updateDto, filter, currentUser);
  }

  async softDelete(
    /**
     * The ID of the user who perform the delete operation
     */
    filter?: RootFilterQuery<Schema>,
    _currentUser?: User,
  ) {
    await this.preSoftDelete(filter, _currentUser);
    const deletedRecords = await this.update(
      {
        deleteTimestamp: new Date(),
      } as unknown as Partial<Schema>,
      filter,
      _currentUser,
    );
    return this.postSoftDelete(deletedRecords, filter, _currentUser);
  }

  async restore(options?: FindManyOptions<Schema>, _currentUser?: User) {
    await this.preRestore(options, _currentUser);
    const deletedRecords = await this.update(
      {
        deleteTimestamp: null,
      } as unknown as Partial<Schema>,
      options,
      _currentUser,
    );
    return this.postRestore(deletedRecords, options, _currentUser);
  }

  /* ---------- Pre-processing functions ---------- */

  protected async preFind(
    options: FindManyOptions<Schema>,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ): Promise<FindManyOptions<Schema>> {
    const { limit, skip } = this.getPaginationProps(options);
    const sort = this.getSortProps(options);

    return {
      ...options,
      limit,
      skip,
      sort,
    };
  }

  protected async preFindOne(
    filter: RootFilterQuery<Schema>,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ): Promise<RootFilterQuery<Schema>> {
    return filter;
  }

  protected async preCount(
    options: FindManyOptions<Schema>,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ): Promise<FindManyOptions<Schema>> {
    return options;
  }

  protected async preCreateOne(createDto: any, _currentUser?: User): Promise<Partial<Schema>> {
    return createDto;
  }

  protected async preCreate(createDtos: any[], _currentUser?: User): Promise<Partial<Schema>[]> {
    return createDtos;
  }

  protected async preUpdate(
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
    _currentUser?: User,
  ): Promise<Partial<Schema>> {
    return {
      ...updateDto,
      updateTimestamp: new Date(),
    };
  }

  protected async preSoftDelete(
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _filter?: RootFilterQuery<Schema>,
    _currentUser?: User,
  ) {}

  protected async preRestore(
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _options?: FindManyOptions<Schema>,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
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

  protected async postFindOne(
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

  protected async postCreateOne(
    record: Schema,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _createDto: any,
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ) {
    return this.findOne({ _id: record._id }) as Promise<Schema>;
  }

  protected async postCreate(
    records: Schema[],
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _createDtos: any[],
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ) {
    return records;
  }

  protected async postUpdate(
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
    /**
     * This arg is not used in the base class,
     * but can be used in derived class
     */
    _currentUser?: User,
  ) {
    return this.model.find({
      _id: { $in: newRecords.map((record) => record._id) },
    });
  }

  protected async postSoftDelete(
    deletedRecords: Schema[],
    _filter?: RootFilterQuery<Schema>,
    _currentUser?: User,
  ) {
    return this.model.find({
      _id: { $in: deletedRecords.map((record) => record._id) },
    });
  }

  protected async postRestore(
    restoredRecords: Schema[],
    _options?: FindManyOptions<Schema>,
    _currentUser?: User,
  ) {
    return this.model.find({
      _id: { $in: restoredRecords.map((record) => record._id) },
    });
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
