import { Injectable, Inject, OnApplicationBootstrap } from '@nestjs/common';
import { TERMINUS_MODULE_OPTIONS, TERMINUS_LIB } from './terminus.constants';
import { TerminusModuleOptions, HealthCheckResult } from './interfaces';
import { HTTP_SERVER_REF } from '@nestjs/core';
import { Server } from 'http';
import { TerminusOptions, HealthCheck } from './interfaces/terminus-options';
import { TerminusRegistry } from './terminus-registry.service';

/**
 * Bootstraps the third party Terminus library with the
 * configured Module options
 */
@Injectable()
export class TerminusBootstrapService implements OnApplicationBootstrap {
  /**
   * The http server of NestJS
   */
  private httpServer: Server;

  /**
   * If the Terminus instance is bootstrapped.
   */
  private isTerminusBootstrapped: boolean = false;
  /**
   * Intiailizes the service
   * @param options The terminus module options
   * @param httpAdapter The http adapter from NestJS which will be used for the terminus instance
   * @param terminus The terminus instance
   */
  constructor(
    @Inject(TERMINUS_MODULE_OPTIONS)
    private readonly options: TerminusModuleOptions,
    @Inject(HTTP_SERVER_REF) private readonly httpAdapter,
    @Inject(TERMINUS_LIB) private readonly terminus,
    private readonly terminusRegistry: TerminusRegistry,
  ) {}

  private async executeHealthChecks(): Promise<HealthCheckResult[]> {
    return await Promise.all<HealthCheckResult>(
      this.terminusRegistry
        .getHealthIndicators()
        .map(healthIndiactor => healthIndiactor.isHealthy()),
    );
  }

  /**
   * Bootstraps the third party terminus library with
   * the given module options
   */
  private bootstrapTerminus() {
    const healthChecks = {
      [this.options.healthUrl || '/health']: async () => {
        const results = await this.executeHealthChecks();
        return (results || []).reduce(
          (previous, current) => Object.assign(previous, current),
          {},
        );
      },
    };

    this.terminus(this.httpServer, {
      healthChecks,
    });
    this.isTerminusBootstrapped = true;
  }

  /**
   * Gets called when the application gets bootstrapped.
   */
  public onApplicationBootstrap() {
    this.httpServer = this.httpAdapter.getHttpServer();
    this.bootstrapTerminus();
  }
}
