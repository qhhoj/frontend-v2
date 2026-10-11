import { ticketDetail } from '../src/test/community-fixtures';
import { expect, test } from './fixtures/api';
import { ok } from './fixtures/reply';

const PROBLEM_TICKETS = '/problems/hcmus41b/tickets';
const SAVED_TICKET_PATH = `/tickets/${ticketDetail().id}`;

test('a ticket filed from the problem link lands on the new ticket', async ({ page, api }) => {
  api.signedIn = true;
  api.routes[`POST ${PROBLEM_TICKETS}`] = ok(ticketDetail());
  await page.goto('/tickets/new?problem=hcmus41b');
  await expect(page.getByText('Bài: Đường đi ngắn nhất')).toBeVisible();
  await page.getByLabel('Tiêu đề (tối đa 100 ký tự)').fill(' Test 17 sai ');
  await page.getByLabel('Nội dung (tối đa 8192 ký tự)').fill('Đáp án mẫu in ra 1.');
  await page.getByRole('button', { name: 'Gửi phiếu' }).click();
  await expect(page).toHaveURL(new RegExp(`${SAVED_TICKET_PATH}$`));
  expect(api.requestsTo(`POST ${PROBLEM_TICKETS}`)).toHaveLength(1);
});
