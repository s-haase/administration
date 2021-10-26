/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-named-default */
import type { default as Bottle, Decorator } from 'bottlejs';
import type { default as Vue, ComponentOptions, AsyncComponent } from 'vue';
import type FeatureService from 'src/app/service/feature.service';
import type LoginService from 'src/core/service/login.service';
import type { ContextState } from 'src/app/state/context.store';
import type { AxiosInstance } from 'axios';
import type { ShopwareClass } from './shopware';
import type { ModuleTypes } from './factory/module.factory';
import type RepositoryFactory from './data/repository-factory.data';

// trick to make it an "external module" to support global type extension
export {};

// base methods for subContainer
interface SubContainer<ContainerName extends string> {
    $decorator(name: string | Decorator, func?: Decorator): this;
    $register(Obj: Bottle.IRegisterableObject): this;
    $list(): (keyof Bottle.IContainer[ContainerName])[];
}

// declare global types
declare global {
    /**
     * "any" type which looks more awful in the code so that spot easier
     * the places where we need to fix the TS types
     */
    type $TSFixMe = any;
    type $TSFixMeFunction = (...args: any[]) => any;

    /**
     * Make the Shopware object globally available
     */
    const Shopware: ShopwareClass;
    interface Window { Shopware: ShopwareClass; }

    /**
     * Define global container for the bottle.js containers
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ServiceContainer extends SubContainer<'service'>{
        loginService: LoginService,
        feature: FeatureService,
        menuService: $TSFixMe,
        privileges: $TSFixMe,
        acl: $TSFixMe,
        jsonApiParserService: $TSFixMe,
        validationService: $TSFixMe,
        timezoneService: $TSFixMe,
        ruleConditionDataProviderService: $TSFixMe,
        productStreamConditionService: $TSFixMe,
        customFieldDataProviderService: $TSFixMe,
        extensionHelperService: $TSFixMe,
        languageAutoFetchingService: $TSFixMe,
        stateStyleDataProviderService: $TSFixMe,
        searchTypeService: $TSFixMe,
        localeToLanguageService: $TSFixMe,
        entityMappingService: $TSFixMe,
        shortcutService: $TSFixMe,
        licenseViolationService: $TSFixMe,
        localeHelper: $TSFixMe,
        filterService: $TSFixMe,
        mediaDefaultFolderService: $TSFixMe,
        appAclService: $TSFixMe,
        appCmsService: $TSFixMe,
        shopwareDiscountCampaignService: $TSFixMe,
        searchRankingService: $TSFixMe,
        searchPreferencesService: $TSFixMe,
        storeService: $TSFixMe,
        repositoryFactory: RepositoryFactory,
        snippetService: $TSFixMe,
        extensionStoreActionService: $TSFixMe,
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface InitContainer extends SubContainer<'init'>{
        state: $TSFixMe,
        router: $TSFixMe,
        httpClient: AxiosInstance,
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface FactoryContainer extends SubContainer<'factory'>{
        component: $TSFixMe,
        template: $TSFixMe,
        module: $TSFixMe,
        entity: $TSFixMe,
        state: $TSFixMe,
        serviceFactory: $TSFixMe,
        classesFactory: $TSFixMe,
        mixin: $TSFixMe,
        filter: $TSFixMe,
        directive: $TSFixMe,
        locale: $TSFixMe,
        shortcut: $TSFixMe,
        plugin: $TSFixMe,
        apiService: $TSFixMe,
        entityDefinition: $TSFixMe,
        workerNotification: $TSFixMe,
    }

    /**
     * Define global state for the Vuex store
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface VuexRootState {
        context: ContextState,
        session: any,
    }

    /**
     * define global Component
     */
    type VueComponent = ComponentOptions<Vue> | typeof Vue | AsyncComponent;
}

/**
 * Link global bottle.js container to the bottle.js container interface
 */
declare module 'bottlejs' { // Use the same module name as the import string
    type IContainerChildren = 'factory' | 'service' | 'init';

    interface IContainer {
        factory: FactoryContainer,
        service: ServiceContainer,
        init: InitContainer,
    }
}

/**
 * Extend the vue-router route information
 */
declare module 'vue-router' {
    interface RouteConfig {
        coreRoute: boolean,
        type: ModuleTypes,
        flag: string,
        isChildren: boolean,
        routeKey: string,
    }
}
