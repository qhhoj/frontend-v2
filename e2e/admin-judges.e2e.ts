import { expect, test } from './fixtures/api';
import { adminOk, dialogOf, signInAsStaff } from './fixtures/admin';
import { JUDGE_FLEET } from '../src/test/admin-fixtures/judges';

const PERMISSIONS = ['judge.change_judge'];

test('cancelling the block dialog returns focus to the Chặn button', async ({ page, api }) => {
  signInAsStaff(api, PERMISSIONS);
  api.routes['GET /judges'] = adminOk(JUDGE_FLEET);
  await page.goto('/admin/judges');
  const block = page
    .getByTestId('judge-row')
    .filter({ hasText: 'qhh-judge-02' })
    .getByRole('button', { name: 'Chặn', exact: true });
  await block.click();
  await dialogOf(page).getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(dialogOf(page)).toBeHidden();
  await expect(block).toBeFocused();
});
