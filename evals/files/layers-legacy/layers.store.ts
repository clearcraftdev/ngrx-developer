// Written for NgRx 20. Used as input for the upgrade eval; it does not compile
// against later majors on purpose.
import { computed, inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';
import { createAction, createFeatureSelector, createSelector, props, Store } from '@ngrx/store';
import { patchState, signalStore, type, withComputed, withMethods, withState } from '@ngrx/signals';
import { event, eventGroup, on, withEffects, withReducer, Events } from '@ngrx/signals/events';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { Observable, map, pipe, switchMap, tap } from 'rxjs';

export interface MapLayer {
  id: string;
  title: string;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class LayersApi {
  load(): Observable<MapLayer[]> {
    throw new Error('Provided by the application');
  }
  saveVisibility(id: string, visible: boolean): Observable<void> {
    throw new Error('Provided by the application');
  }
}

export const layersEvents = eventGroup({
  source: 'Layers Panel',
  events: {
    opened: type<void>(),
    visibilityToggled: type<string>(),
  },
});

export const layersApiEvents = eventGroup({
  source: 'Layers API',
  events: {
    loaded: type<MapLayer[]>(),
    loadFailed: type<string>(),
  },
});

export const LayersStore = signalStore(
  { providedIn: 'root' },
  withState({ layers: [] as MapLayer[], loading: false, error: null as string | null }),
  withComputed(({ layers }) => ({
    visibleCount: computed(() => layers().filter((layer) => layer.visible).length),
  })),
  withReducer(
    on(layersEvents.opened, () => ({ loading: true })),
    on(layersApiEvents.loaded, ({ payload }) => ({ layers: payload, loading: false })),
    on(layersApiEvents.loadFailed, ({ payload }) => ({ error: payload, loading: false })),
    on(layersEvents.visibilityToggled, ({ payload }, state) => ({
      layers: state.layers.map((layer) =>
        layer.id === payload ? { ...layer, visible: !layer.visible } : layer
      ),
    }))
  ),
  withEffects((store, events = inject(Events), api = inject(LayersApi)) => ({
    load$: events.on(layersEvents.opened).pipe(
      switchMap(() =>
        api.load().pipe(
          tapResponse(
            (layers) => layersApiEvents.loaded(layers),
            (error: Error) => layersApiEvents.loadFailed(error.message)
          )
        )
      )
    ),
  })),
  withMethods((store, api = inject(LayersApi)) => ({
    persistVisibility: rxMethod<string>(
      pipe(
        switchMap((id) => {
          const layer = store.layers().find((candidate) => candidate.id === id);
          return api.saveVisibility(id, !!layer?.visible).pipe(
            tapResponse(
              () => patchState(store, { error: null }),
              (error: Error) => patchState(store, { error: error.message })
            )
          );
        })
      )
    ),
  }))
);

// Classic Store part kept for the print module.
export const printRequested = createAction('[Print] Requested', props<{ scale: number }>());
export const printPrepared = createAction('[Print] Prepared', props<{ scale: number; layerIds: string[] }>());

interface PrintState {
  selectedLayerIds: string[];
}

export const selectPrint = createFeatureSelector<PrintState>('print');
export const selectSelectedLayerIds = createSelector(selectPrint, (state) => state.selectedLayerIds);

@Injectable()
export class PrintEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);

  readonly prepare$ = createEffect(() =>
    this.actions$.pipe(
      ofType(printRequested),
      concatLatestFrom(() => this.store.select(selectSelectedLayerIds)),
      map(([{ scale }, layerIds]) => printPrepared({ scale, layerIds })),
      tap(() => undefined)
    )
  );
}
