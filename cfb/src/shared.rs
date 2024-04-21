use super::*;

pub trait PairUtils<'a> {
    fn find_rule(&self, rule: Rule) -> Option<Pair<Rule>>;
    fn find_rules(&self, rule: Rule) -> Vec<Pair<Rule>>;
    fn dig_for_rule(self, rule: Rule) -> Option<Pair<'a, Rule>>;
    fn dig_for_rules(self, rule: Rule) -> Vec<Pair<'a, Rule>>;

    fn expect_to_be(&self, rule: Rule) -> anyhow::Result<&Pair<'a, Rule>>;
    fn expect_to_be_one_of(&self, rules: Vec<Rule>) -> anyhow::Result<&Pair<'a, Rule>>;
}

impl<'a> PairUtils<'a> for Pair<'a, Rule> {
    fn find_rule(&self, rule: Rule) -> Option<Pair<Rule>> {
        self.clone()
            .into_inner()
            .find(|pair| pair.as_rule() == rule)
    }

    fn find_rules(&self, rule: Rule) -> Vec<Pair<Rule>> {
        self.clone()
            .into_inner()
            .into_iter()
            .filter(|pair| pair.as_rule() == rule)
            .collect_vec()
    }

    fn dig_for_rule(self, rule: Rule) -> Option<Pair<'a, Rule>> {
        self.dig_for_rules(rule).into_iter().nth(0)
    }

    fn dig_for_rules(self, rule: Rule) -> Vec<Pair<'a, Rule>> {
        if self.as_rule() == rule {
            vec![self]
        } else {
            self.into_inner()
                .flat_map(|pair| pair.dig_for_rules(rule))
                .collect_vec()
        }
    }

    fn expect_to_be(&self, rule: Rule) -> anyhow::Result<&Pair<'a, Rule>> {
        if self.as_rule() == rule {
            return Ok(self);
        }

        bail!("expected {self:#?} to be of rule type: {rule:?}")
    }

    fn expect_to_be_one_of(&self, rules: Vec<Rule>) -> anyhow::Result<&Pair<'a, Rule>> {
        for rule in &rules {
            if &self.as_rule() == rule {
                return Ok(self);
            }
        }

        bail!("expected {self:#?} to be of the following rule types: {rules:#?}")
    }
}

//

pub trait CfbIterUtil<T> {
    fn head_tail(&mut self) -> Option<(T, Vec<T>)>;
}

impl<I, T> CfbIterUtil<T> for I
where
    I: Iterator<Item = T>,
{
    fn head_tail<'a>(&'a mut self) -> Option<(T, Vec<T>)> {
        let head = self.nth(0)?;
        let rest = self.collect_vec();
        Some((head, rest))
    }
}
