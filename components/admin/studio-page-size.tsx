'use client';

import {SelectMenu} from '@/components/selection-dialog';
import {studioPageSizes} from '@/lib/pagination';

export function StudioPageSize({value}: {value: number}) {
  return <label className="studio-page-size"><span>Rows per page</span>
    <SelectMenu name="per" defaultValue={String(value)} onChange={event => event.currentTarget.form?.requestSubmit()}>
      {studioPageSizes.map(size => <option key={size} value={size}>{size}</option>)}
    </SelectMenu>
  </label>;
}
