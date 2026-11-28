-- Where a coupon can be used: comma-separated SUBSCRIPTION, COURSE (courses and
-- masterclasses), EBOOK. Existing coupons keep working on memberships only.
ALTER TABLE coupons ADD COLUMN applies_to VARCHAR(60) NOT NULL DEFAULT 'SUBSCRIPTION,COURSE,EBOOK';
UPDATE coupons SET applies_to = 'SUBSCRIPTION';
