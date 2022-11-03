
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export interface CreateAddressInput {
    address?: Nullable<string>;
    val?: Nullable<number>;
    desc?: Nullable<string>;
}

export interface Send {
    value?: Nullable<number>;
}

export interface Address {
    __typename?: 'Address';
    address: string;
    val?: Nullable<number>;
    desc?: Nullable<string>;
}

export interface Node {
    __typename?: 'Node';
    id?: Nullable<string>;
    val?: Nullable<number>;
}

export interface Link {
    __typename?: 'Link';
    source?: Nullable<string>;
    target?: Nullable<string>;
}

export interface Graph {
    __typename?: 'Graph';
    nodes?: Nullable<Nullable<Node>[]>;
    links?: Nullable<Nullable<Link>[]>;
}

export interface IQuery {
    __typename?: 'IQuery';
    getAddresses(): Nullable<Nullable<Address>[]> | Promise<Nullable<Nullable<Address>[]>>;
    getAddress(address: string): Nullable<Address> | Promise<Nullable<Address>>;
    getGraph(): Nullable<Graph> | Promise<Nullable<Graph>>;
}

export interface IMutation {
    __typename?: 'IMutation';
    createAddress(createAddressInput?: Nullable<CreateAddressInput>): Nullable<Address> | Promise<Nullable<Address>>;
}

type Nullable<T> = T | null;
